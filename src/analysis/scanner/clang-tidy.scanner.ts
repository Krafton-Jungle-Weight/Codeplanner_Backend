import { execa } from "execa";
import { join } from "path";

export async function runClangTidy(): Promise<string>{
  const filePath = join(__dirname, '..', '..', '..', 'src', 'static', 'code-samples', 'example1.c');
  console.log('Clang-tidy filePath:', filePath);

  try {
    const { stdout } = await execa('clang-tidy', [filePath, '--', '-std=c11'], {
      env: { PATH: process.env.PATH },
    });
    return stdout;
  } catch(error: any){
    return error.stdout || error.message;
  }
}