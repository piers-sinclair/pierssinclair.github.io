import frontMatter from 'front-matter';

export interface PostModel {
    content: string;
    frontmatter: {
        title: string;
        date: string;
        author: string;
        layout: string;
        categories: string;
        published: boolean;
    }
    slug: string;
};

export const fetchPosts = async () => {
    const response = await fetch("/posts/posts.json");
    const files = await response.json();

    const posts = await Promise.all(
      files.map(async (fileName: string) => {
        return await fetchPost(fileName);
      })
    );
  
    return posts;
  };

export const fetchPost = async (fileName: string) => {
    fileName += ".md";
    const fileContent = await fetch(`/posts/${fileName}`).then((res) => res.text());
    return fetchPostMetadata(fileName, fileContent);
}

export const fetchPostMetadata = (fileName: string, fileContent: string) => {
  const { attributes: frontmatter, body: content } = frontMatter(fileContent);
  return { frontmatter, content, slug: fileName.replace(".md", "") } as PostModel;

}
export {};
