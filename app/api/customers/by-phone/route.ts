import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone")?.trim();

  if (!phone) return NextResponse.json({ customer: null });

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, full_name, phone, city, district, source_id, branch_id, assigned_employee_id, current_status, purchase_probability"
    )
    .eq("phone", phone)
    .maybeSingle();

  if (error) return NextResponse.json({ customer: null });

  return NextResponse.json({ customer: data });
}
