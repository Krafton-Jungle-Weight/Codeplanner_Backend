/**
 * GitHub URL에서 owner와 repo 추출하는 유틸리티 함수
 */
export function parseGitHubUrl(repoUrl: string) {
  if (!repoUrl) return null;
  
  // 다양한 GitHub URL 형식 지원
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/, // https://github.com/owner/repo
    /github\.com\/([^\/]+)\/([^\/]+)\.git/, // https://github.com/owner/repo.git
    /git@github\.com:([^\/]+)\/([^\/]+)\.git/, // git@github.com:owner/repo.git
  ];
  
  for (const pattern of patterns) {
    const match = repoUrl.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace('.git', ''),
      };
    }
  }
  
  return null;
} 