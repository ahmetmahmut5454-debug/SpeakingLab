const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const script = `
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      let isUnregistered = false;
      for(let registration of registrations) {
        registration.unregister();
        isUnregistered = true;
      }
      if (isUnregistered) {
        window.location.reload(true);
      }
    });
  }
</script>
`;

code = code.replace(/<head>/, `<head>\n${script}`);
fs.writeFileSync('index.html', code);
console.log("Patched index.html");
