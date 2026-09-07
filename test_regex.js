let targetUrl = "/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=proxy_key";
const apiKey = "AIzaSy";
targetUrl = targetUrl.replace(/([?&])key=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'key=' + apiKey;
console.log(targetUrl);
