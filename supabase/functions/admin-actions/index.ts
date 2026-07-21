import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateBossBody {
  action: "create_boss";
  name: string;
  email: string;
  password: string;
  businessName: string;
  plan: string;
  trialDays?: number;
}

interface CreateEmployeeBody {
  action: "create_employee";
  name: string;
  email: string;
  password: string;
  tenantId: string;
}

interface UpdateEmployeeBody {
  action: "update_employee";
  profileId: string;
  role?: string;
  active?: boolean;
}

interface ToggleTenantBody {
  action: "toggle_tenant";
  tenantId: string;
  status: string;
  trialDays?: number;
}

type Body = CreateBossBody | CreateEmployeeBody | UpdateEmployeeBody | ToggleTenantBody;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";

    // Verify caller is super_admin using anon key (respects RLS)
    const callerClient = createClient(supabaseUrl, anonKey);
    const { data: callerProfile, error: callerErr } = await callerClient
      .from("profiles")
      .select("id, role, tenant_id")
      .eq("id", (await callerClient.auth.getUser()).data.user?.id ?? "")
      .maybeSingle();

    if (callerErr || !callerProfile || callerProfile.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const admin = createClient(supabaseUrl, serviceKey);

    if (body.action === "create_boss") {
      const { name, email, password, businessName, plan, trialDays } = body as CreateBossBody;
      const days = trialDays ?? 14;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      // STEP 1: Create tenant FIRST (before auth user) so FK on profiles.tenant_id is satisfied
      const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "negocio";
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

      const { data: tenantRow, error: tenantErr } = await admin
        .from("tenants")
        .insert({
          name: businessName,
          slug: uniqueSlug,
          primary_color: "#5865F2",
          accent_color: "#5865F2",
          logo_emoji: "🛒",
          status: "active",
          plan,
          subscription_expires_at: expiresAt,
          trial_days: days,
        })
        .select()
        .single();

      if (tenantErr || !tenantRow) {
        return new Response(JSON.stringify({ error: tenantErr?.message ?? "Error al crear negocio" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newTenantId = tenantRow.id;

      // STEP 2: Create auth user with service role (bypasses RLS, doesn't affect caller's session)
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authErr) {
        // Rollback: delete the tenant we just created
        await admin.from("tenants").delete().eq("id", newTenantId);
        return new Response(JSON.stringify({ error: authErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = authData.user.id;

      // STEP 3: Create profile linking auth user to tenant with role 'boss'
      const { error: profErr } = await admin.from("profiles").insert({
        id: userId,
        tenant_id: newTenantId,
        name,
        role: "boss",
        active: true,
      });

      if (profErr) {
        // Rollback: delete tenant AND auth user
        await admin.from("tenants").delete().eq("id", newTenantId);
        await admin.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({ error: profErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, tenantId: newTenantId, userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "create_employee") {
      const { name, email, password, tenantId } = body as CreateEmployeeBody;

      // Verify tenant exists first
      const { data: tenantCheck, error: tenantCheckErr } = await admin
        .from("tenants")
        .select("id")
        .eq("id", tenantId)
        .maybeSingle();

      if (tenantCheckErr || !tenantCheck) {
        return new Response(JSON.stringify({ error: "El negocio especificado no existe" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 1: Create auth user
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (authErr) {
        return new Response(JSON.stringify({ error: authErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userId = authData.user.id;

      // Step 2: Create profile
      const { error: profErr } = await admin.from("profiles").insert({
        id: userId,
        tenant_id: tenantId,
        name,
        role: "employee",
        active: true,
      });
      if (profErr) {
        await admin.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({ error: profErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "update_employee") {
      const { profileId, role, active } = body as UpdateEmployeeBody;
      const updates: Record<string, unknown> = {};
      if (role !== undefined) updates.role = role;
      if (active !== undefined) updates.active = active;

      const { error } = await admin.from("profiles").update(updates).eq("id", profileId);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "toggle_tenant") {
      const { tenantId, status, trialDays } = body as ToggleTenantBody;
      const updates: Record<string, unknown> = { status };
      if (trialDays !== undefined) {
        updates.trial_days = trialDays;
        updates.subscription_expires_at = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
      }
      const { error } = await admin.from("tenants").update(updates).eq("id", tenantId);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Acción no válida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
