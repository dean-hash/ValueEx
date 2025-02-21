import { spawn } from 'child_process';
import { watch } from 'chokidar';
import { resolve } from 'path';

class DevelopmentAccelerator {
  private processes: Map<string, any> = new Map();

  async start() {
    this.startTypeCheck();
    this.startTestWatch();
    this.startBuildWatch();
    this.watchForChanges();
  }

  private startTypeCheck() {
    const tsc = spawn('npx', ['tsc', '--watch', '--noEmit']);
    this.processes.set('typecheck', tsc);

    tsc.stdout.on('data', (data) => {
      console.log('[TypeCheck]', data.toString());
    });
  }

  private startTestWatch() {
    const jest = spawn('npx', ['jest', '--watch']);
    this.processes.set('test', jest);

    jest.stdout.on('data', (data) => {
      console.log('[Test]', data.toString());
    });
  }

  private startBuildWatch() {
    const build = spawn('npm', ['run', 'build:watch']);
    this.processes.set('build', build);

    build.stdout.on('data', (data) => {
      console.log('[Build]', data.toString());
    });
  }

  private watchForChanges() {
    const watcher = watch(['src/**/*'], {
      ignored: /(^|[\/\\])\../,
      persistent: true,
    });

    watcher.on('change', (path) => {
      console.log(`File ${path} has been changed`);
      this.triggerRelevantProcesses(path);
    });
  }

  private triggerRelevantProcesses(path: string) {
    if (path.endsWith('.ts')) {
      // Trigger type checking
      const tsc = this.processes.get('typecheck');
      if (tsc) tsc.stdin.write('check\n');
    }
  }

  stop() {
    for (const [name, process] of this.processes) {
      console.log(`Stopping ${name}...`);
      process.kill();
    }
  }
}

export const accelerator = new DevelopmentAccelerator();

if (require.main === module) {
  accelerator.start().catch(console.error);
}
