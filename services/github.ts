const REPO_OWNER = 'printmypet';
const REPO_NAME = 'PrintMy3D';
const IMAGES_PATH = 'public/images/products';
const BRANCH = 'master';

export const uploadImageToGitHub = async (
  token: string,
  file: File
): Promise<{ success: boolean; url?: string; message?: string }> => {
  try {
    const base64 = await fileToBase64(file);
    const filename = sanitizeFilename(file.name);
    const path = `${IMAGES_PATH}/${filename}`;
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

    // Check if file already exists to get its SHA (required for update)
    let sha: string | undefined;
    const checkRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }

    const body: Record<string, string> = {
      message: `Upload image: ${filename}`,
      content: base64,
      branch: BRANCH,
    };
    if (sha) body.sha = sha;

    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, message: err.message || 'Erro ao enviar imagem.' };
    }

    const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${path}`;
    return { success: true, url: rawUrl };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const sanitizeFilename = (name: string): string => {
  const ext = name.split('.').pop() || 'jpg';
  const base = name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  return `${base}_${Date.now()}.${ext}`;
};
