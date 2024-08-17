import fm from "front-matter";

export interface PostModel {
    content: string;
    frontmatter: {
        title: string;
        date: string;
        author: string;
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
    const { attributes: frontmatter, body: content } = fm(fileContent);
    return { frontmatter, content, slug: fileName.replace(".md", "") } as PostModel;
}
export {};
