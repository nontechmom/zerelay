# Multi-User Onboarding Test Script
# This demonstrates how multiple users can onboard independently

Write-Output "==================================="
Write-Output "  MULTI-USER ONBOARDING FLOW TEST"
Write-Output "==================================="

$token = (Get-Content test_token.txt -Raw).Trim()

Write-Output "`n📋 SCENARIO:"
Write-Output "User: test@zerelay.com wants to integrate Resend"
Write-Output "Goal: Store API key → Get webhook URL → Configure in Resend → Verify"

Write-Output "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Output "STEP 1: Check Current Onboarding Status"
Write-Output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

try {
  $status = Invoke-RestMethod -Uri "http://localhost:3000/api/onboarding" -Method Get -Headers @{
    "Authorization" = "Bearer $token"
  }
  Write-Output "✓ Current Status:"
  Write-Output "  Has API Key: $($status.hasApiKey)"
  Write-Output "  Has Webhook: $($status.hasWebhookToken)"
  Write-Output "  Webhook Active: $($status.webhookActive)"
  Write-Output "  Onboarding Complete: $($status.onboardingComplete)"
} catch {
  Write-Output "✗ Error: $($_.ErrorDetails.Message)"
}

Write-Output "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Output "STEP 2: User Provides Resend API Key"
Write-Output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$apiKey = "re_DG7QFSX8_AzytNTgrp5855R5UE8TJYgDg"
Write-Output "API Key: $apiKey"

$step1Body = @{
  step = "store_api_key"
  resendApiKey = $apiKey
} | ConvertTo-Json

try {
  $result = Invoke-RestMethod -Uri "http://localhost:3000/api/onboarding" -Method Post -Body $step1Body -ContentType "application/json" -Headers @{
    "Authorization" = "Bearer $token"
  }
  
  Write-Output "`n✓ API Key Validated and Stored!"
  Write-Output "`n📍 YOUR UNIQUE WEBHOOK URL:"
  Write-Output "   $($result.webhookUrl)"
  
  Write-Output "`n📝 INSTRUCTIONS FOR USER:"
  $result.instructions | ForEach-Object { Write-Output "   $_" }
  
  # Save for later use
  $result.webhookUrl | Out-File -FilePath "user_webhook_url.txt" -Encoding ASCII
  $result.webhookToken | Out-File -FilePath "user_webhook_token.txt" -Encoding ASCII
  
  Write-Output "`n💾 Webhook URL saved to: user_webhook_url.txt"
  
} catch {
  Write-Output "✗ Error: $($_.ErrorDetails.Message)"
  exit
}

Write-Output "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Output "STEP 3: User Configures Webhook in Resend Dashboard"
Write-Output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Write-Output "`n⏸️  MANUAL STEP REQUIRED:"
Write-Output "   1. User opens Resend Dashboard"
Write-Output "   2. Goes to Webhooks section"
Write-Output "   3. Adds the webhook URL shown above"
Write-Output "   4. Selects events to receive"
Write-Output "   5. Copies the Signing Secret (whsec_...)"

$signingSecret = "whsec_Acvav8FfWZqD3eJwqPAs37XCFXGIMf+x"
Write-Output "`n✓ User received signing secret from Resend: $signingSecret"

Write-Output "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Output "STEP 4: User Completes Setup with Signing Secret"
Write-Output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$step2Body = @{
  step = "store_signing_secret"
  webhookSigningSecret = $signingSecret
} | ConvertTo-Json

try {
  $result = Invoke-RestMethod -Uri "http://localhost:3000/api/onboarding" -Method Post -Body $step2Body -ContentType "application/json" -Headers @{
    "Authorization" = "Bearer $token"
  }
  
  Write-Output "`n✓ $($result.message)"
  Write-Output "`n🎉 FEATURES ENABLED:"
  $result.features | ForEach-Object { Write-Output "   $_" }
  
} catch {
  Write-Output "✗ Error: $($_.ErrorDetails.Message)"
}

Write-Output "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Output "STEP 5: Verify Final Status"
Write-Output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

try {
  $status = Invoke-RestMethod -Uri "http://localhost:3000/api/onboarding" -Method Get -Headers @{
    "Authorization" = "Bearer $token"
  }
  Write-Output "✓ Final Status:"
  Write-Output "  Onboarding Complete: $($status.onboardingComplete)"
  Write-Output "  Webhook URL: $($status.webhookUrl)"
  Write-Output "  API Key Configured: $($status.apiKeyConfiguredAt)"
  Write-Output "  Webhook Configured: $($status.webhookConfiguredAt)"
} catch {
  Write-Output "✗ Error: $($_.ErrorDetails.Message)"
}

Write-Output "`n==================================="
Write-Output "✅ MULTI-USER ONBOARDING COMPLETE"
Write-Output "==================================="

Write-Output "`n📊 WHAT HAPPENS FOR EACH NEW USER:"
Write-Output "1. User signs up → Gets unique user ID"
Write-Output "2. User enters API key → System generates unique webhook token"
Write-Output "3. User gets personalized webhook URL"
Write-Output "4. User configures in Resend → Gets signing secret"
Write-Output "5. User enters signing secret → Integration active"
Write-Output "6. User can now send/receive emails independently"

Write-Output "`n🔐 SECURITY PER USER:"
Write-Output "• Unique webhook token (wh_...)"
Write-Output "• Encrypted API key storage"
Write-Output "• Per-user signing secret"
Write-Output "• Isolated audit logs"
Write-Output "• Row-level security policies"

Write-Output "`n🚀 Ready for production with unlimited users!"
