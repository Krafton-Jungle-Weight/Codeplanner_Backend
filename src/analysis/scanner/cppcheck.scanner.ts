import { execa } from "execa";
import { join } from "path";

export async function runCppcheck(): Promise<string> {
  const filePath = join(__dirname, '..', '..', '..', 'src', 'static', 'code-samples', 'example1.c');
  console.log('Cppcheck filePath:', filePath);

  try {
    const { stdout, stderr } = await execa('cppcheck', ['--enable=all', filePath]);
    return stdout + '\n' + stderr;
  } catch (error: any) {
    return error.stdout || error.stderr || error.message;
  }
}