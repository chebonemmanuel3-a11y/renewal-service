const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SESSION = "RGNK~aEaAPDZ1";

function run(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error('Error running command: ' + command);
    process.exit(1);
  }
}

if (!fs.existsSync('./ffmpeg')) {
  console.log("🔧 Downloading FFmpeg...");
  run('curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz');
  run('tar -xf ffmpeg.tar.xz');
  const ffmpegDir = fs.readdirSync('.').find(d => /^ffmpeg-.*-static$/.test(d));
  if (!ffmpegDir) {
    console.error('FFmpeg static directory not found after extraction.');
    process.exit(1);
  }
  fs.renameSync(path.join(ffmpegDir, 'ffmpeg'), './ffmpeg');
  run('chmod +x ./ffmpeg');
  run('rm -rf ffmpeg.tar.xz ' + ffmpegDir);
  console.log("✅ FFmpeg ready.");
} else {
  console.log("⚡ FFmpeg already exists.");
}

if (!fs.existsSync('./raganork-md')) {
  console.log("📥 Cloning raganork-md...");
  run('git clone https://github.com/souravkl11/raganork-md');
} else {
  console.log("🔄 raganork-md already cloned.");
}

try {
  process.chdir('./raganork-md');
} catch {
  console.error('Failed to change directory to raganork-md!');
  process.exit(1);
}

try {
  execSync('yarn --version', { stdio: 'ignore' });
} catch {
  console.log("📦 Installing yarn with Corepack...");
  run('corepack enable');
  run('echo y | corepack prepare yarn@1.22.22 --activate --yes');
}

console.log("📦 Installing dependencies with yarn...");
run('yarn install --ignore-engines');

console.log("🔐 Writing session...");
fs.writeFileSync('config.env', 'SESSION=' + SESSION + '\n');

console.log("🚀 Starting bot...");
run('yarn start');
