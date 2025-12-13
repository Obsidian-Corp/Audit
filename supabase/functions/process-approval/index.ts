import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        function: "process-approval",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { recordId, decision, comments } = await req.json();

    if (!recordId || !decision || !comments) {
      throw new Error("Missing required fields: recordId, decision, comments");
    }

    // Get the approval record
    const { data: record, error: recordError } = await supabaseClient
      .from("approval_records")
      .select(`
        *,
        approval_stages(
          *,
          approval_workflows(*)
        )
      `)
      .eq("id", recordId)
      .single();

    if (recordError || !record) {
      throw new Error("Approval record not found");
    }

    // Update the approval record
    const { error: updateError } = await supabaseClient
      .from("approval_records")
      .update({
        status: decision,
        comments: comments,
        decided_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    if (updateError) throw updateError;

    const stage = record.approval_stages;
    const workflow = stage.approval_workflows;

    // Get deliverable approval
    const { data: deliverableApproval, error: daError } = await supabaseClient
      .from("deliverable_approvals")
      .select("*")
      .eq("id", record.deliverable_approval_id)
      .single();

    if (daError || !deliverableApproval) {
      throw new Error("Deliverable approval not found");
    }

    // If rejected, mark workflow as rejected
    if (decision === "rejected") {
      await supabaseClient
        .from("deliverable_approvals")
        .update({
          status: "rejected",
          completed_at: new Date().toISOString(),
        })
        .eq("id", deliverableApproval.id);

      await supabaseClient
        .from("deliverables")
        .update({ status: "rejected" })
        .eq("id", deliverableApproval.deliverable_id);

      console.log("Workflow rejected at stage:", stage.name);
      return new Response(JSON.stringify({ success: true, action: "rejected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if stage is complete
    const { data: stageRecords } = await supabaseClient
      .from("approval_records")
      .select("status")
      .eq("stage_id", stage.id)
      .eq("deliverable_approval_id", deliverableApproval.id);

    const approvedCount = stageRecords?.filter((r) => r.status === "approved").length || 0;

    console.log(`Stage ${stage.name}: ${approvedCount}/${stage.required_approvals} approvals`);

    // Check if stage requirements are met
    if (approvedCount >= stage.required_approvals) {
      // Get next stage
      const { data: nextStage } = await supabaseClient
        .from("approval_stages")
        .select("*")
        .eq("workflow_id", workflow.id)
        .gt("stage_order", stage.stage_order)
        .order("stage_order", { ascending: true })
        .limit(1)
        .single();

      if (nextStage) {
        // Move to next stage
        await supabaseClient
          .from("deliverable_approvals")
          .update({ current_stage_id: nextStage.id })
          .eq("id", deliverableApproval.id);

        // Create approval records for next stage approvers
        const { data: nextApprovers } = await supabaseClient
          .from("stage_approvers")
          .select("user_id")
          .eq("stage_id", nextStage.id);

        if (nextApprovers && nextApprovers.length > 0) {
          const approvalRecords = nextApprovers.map((a) => ({
            deliverable_approval_id: deliverableApproval.id,
            stage_id: nextStage.id,
            approver_id: a.user_id,
            status: "pending",
          }));

          await supabaseClient.from("approval_records").insert(approvalRecords);

          // Create notifications for next stage approvers
          const notifications = nextApprovers.map((a) => ({
            user_id: a.user_id,
            type: "approval_request",
            title: "Approval Required",
            message: `Your approval is needed for stage: ${nextStage.name}`,
            metadata: {
              deliverable_id: deliverableApproval.deliverable_id,
              stage_id: nextStage.id,
            },
          }));

          await supabaseClient.from("notifications").insert(notifications);
        }

        console.log("Moved to next stage:", nextStage.name);
        return new Response(JSON.stringify({ success: true, action: "next_stage" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Workflow complete - all stages approved
        await supabaseClient
          .from("deliverable_approvals")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", deliverableApproval.id);

        const { data: { user } } = await supabaseClient.auth.getUser();
        
        await supabaseClient
          .from("deliverables")
          .update({
            status: "approved",
            approved_by: user?.id || null,
            approved_at: new Date().toISOString(),
          })
          .eq("id", deliverableApproval.deliverable_id);

        console.log("Workflow completed - deliverable approved");
        return new Response(JSON.stringify({ success: true, action: "completed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Stage not yet complete, waiting for more approvals
    console.log("Waiting for more approvals in current stage");
    return new Response(JSON.stringify({ success: true, action: "waiting" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing approval:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
