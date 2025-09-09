
import fetch from 'node-fetch';

const BASE_URL = 'http://0.0.0.0:5000';

async function testShareImplementation() {
  console.log('🧪 Testing Share Implementation\n');
  
  try {
    // 1. Create test token
    console.log('1. Creating test token...');
    const tokenResponse = await fetch(`${BASE_URL}/test/create-token`);
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.token) {
      throw new Error('Failed to create test token');
    }
    
    console.log('✅ Token created successfully');
    console.log(`   Token: ${tokenData.token.substring(0, 50)}...`);
    console.log(`   Share URL: ${tokenData.testUrls.share}`);
    console.log(`   OG URL: ${tokenData.testUrls.og}\n`);
    
    const token = tokenData.token;
    
    // 2. Test share page with bot user-agent
    console.log('2. Testing share page with bot user-agent...');
    const botResponse = await fetch(`${BASE_URL}/s/${token}`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1'
      }
    });
    
    if (botResponse.status !== 200) {
      throw new Error(`Bot request failed: ${botResponse.status}`);
    }
    
    const botHtml = await botResponse.text();
    
    // Check for essential OG tags
    const requiredTags = [
      'og:title',
      'og:description', 
      'og:image',
      'og:url',
      'twitter:card'
    ];
    
    const missingTags = requiredTags.filter(tag => !botHtml.includes(tag));
    
    if (missingTags.length > 0) {
      throw new Error(`Missing OG tags: ${missingTags.join(', ')}`);
    }
    
    console.log('✅ Bot request successful - all OG tags present');
    
    // Check that no redirect notice is shown for bots
    if (botHtml.includes('Redirecting to app')) {
      console.log('⚠️  Warning: Redirect notice shown to bot (should be hidden)');
    } else {
      console.log('✅ No redirect notice for bot (correct)');
    }
    
    // 3. Test share page with human user-agent
    console.log('\n3. Testing share page with human user-agent...');
    const humanResponse = await fetch(`${BASE_URL}/s/${token}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });
    
    if (humanResponse.status !== 200) {
      throw new Error(`Human request failed: ${humanResponse.status}`);
    }
    
    const humanHtml = await humanResponse.text();
    
    // Check that redirect notice is shown for humans
    if (humanHtml.includes('Redirecting to app')) {
      console.log('✅ Redirect notice shown to human (correct)');
    } else {
      console.log('⚠️  Warning: No redirect notice for human (should be shown)');
    }
    
    // 4. Test OG image generation
    console.log('\n4. Testing OG image generation...');
    const imageResponse = await fetch(`${BASE_URL}/og/${token}`);
    
    if (imageResponse.status !== 200) {
      throw new Error(`OG image request failed: ${imageResponse.status}`);
    }
    
    const contentType = imageResponse.headers.get('content-type');
    if (contentType !== 'image/png') {
      throw new Error(`Wrong content type: ${contentType}, expected image/png`);
    }
    
    const imageBuffer = await imageResponse.buffer();
    console.log(`✅ OG image generated successfully (${imageBuffer.length} bytes)`);
    
    // 5. Test token verification
    console.log('\n5. Testing token verification...');
    const dreamId = 'test-dream-id';
    const checkResponse = await fetch(`${BASE_URL}/api/check-token/${dreamId}`);
    const checkData = await checkResponse.json();
    
    console.log(`✅ Token check endpoint working: revoked=${checkData.revoked}`);
    
    // 6. Test token revocation
    console.log('\n6. Testing token revocation...');
    const revokeResponse = await fetch(`${BASE_URL}/api/revoke-share-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dreamId })
    });
    
    if (revokeResponse.status !== 200) {
      throw new Error('Token revocation failed');
    }
    
    console.log('✅ Token revoked successfully');
    
    // 7. Test access to revoked token
    console.log('\n7. Testing access to revoked token...');
    const revokedResponse = await fetch(`${BASE_URL}/s/${token}`);
    
    if (revokedResponse.status === 403) {
      console.log('✅ Revoked token correctly rejected (403)');
    } else {
      console.log(`⚠️  Warning: Revoked token returned status ${revokedResponse.status} (expected 403)`);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\nNext steps for manual testing:');
    console.log('1. Test social media unfurling:');
    console.log(`   - Facebook: https://developers.facebook.com/tools/debug/`);
    console.log(`   - Twitter: https://cards-dev.twitter.com/validator`);
    console.log(`   - LinkedIn: https://www.linkedin.com/post-inspector/`);
    console.log('2. Test in messaging apps (WhatsApp, Slack, Discord)');
    console.log('3. Test with different screen sizes and devices');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testShareImplementation();
