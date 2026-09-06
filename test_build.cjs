const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log("BUILD OK");
} catch (e) {
  console.log("BUILD FAILED");
  console.log(e.stdout.toString());
  console.log(e.stderr.toString());
}
