import fs from "fs";
import path from "path";
import { marked } from "marked";
import { Feed } from "feed";
import { fetchPostMetadata } from "./postUtils";

  const POSTS_DIR = path.join(process.cwd(), "public", "posts");
  
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }
  
  const mdFiles = fs.readdirSync(POSTS_DIR).filter((file) => file.endsWith(".md"));
  
  const baseUrl = "https://www.pierssinclair.com";
  
  const feed = new Feed({
    title: "Piers Sinclair's Blog",
    description: "A feed of my blog posts",
    id: baseUrl,
    link: baseUrl,
    language: "en",
    updated: new Date(), 
    generator: "Feed for Node.js",
    feedLinks: {
      atom: `${baseUrl}/feed.xml`,
    },
    author: {
      name: "Piers Sinclair",
      link: baseUrl,
    },
    copyright: ""
  });

  const getExcerpt = (content: string): string => {
    const paragraphs = content.split('\n').filter(line => line.trim() !== '');
    return paragraphs.length > 0 ? paragraphs[0] : '';
  };
  
  const processPost = async (filename: string): Promise<Date | null> => {
    try {
      const filePath = path.join(POSTS_DIR, filename);
      const raw = fs.readFileSync(filePath, "utf8");
      
      const post = fetchPostMetadata(filename, raw);

      if (!post.frontmatter.published) {
        console.log(`Skipping ${filename}: Not published.`);
        return null;
      }
  
      if (!post.frontmatter.title || !post.frontmatter.date || !post.frontmatter.author) {
        console.warn(`Skipping ${filename}: Missing required front matter fields.`);
        return null;
      }
  
      const htmlContent = await marked(post.content);
  
      const postUrl = `${baseUrl}/posts/${post.slug}`;
  
      const categories = post.frontmatter.categories.split(',').map((cat: string) => cat.trim());
  
      const description = getExcerpt(post.content);
  
      // Add the post to the feed
      feed.addItem({
        title: post.frontmatter.title,
        id: postUrl,
        link: postUrl,
        description: description,
        content: htmlContent,
        date: new Date(post.frontmatter.date),
        author: [
          {
            name: post.frontmatter.author,
            email: "your.email@example.com", // Replace with your actual email
            link: baseUrl,
          },
        ],
        category: categories.map((cat) => ({ name: cat })),
      });
  
      return new Date(post.frontmatter.date);
    } catch (error) {
      console.error(`Error processing file ${filename}:`, error);
      return null;
    }
  };
  
  const generateFeed = async () => {
    let latestDate = new Date(0);
  
    for (const filename of mdFiles) {
      const postDate = await processPost(filename);
      if (postDate && postDate > latestDate) {
        latestDate = postDate;
      }
    }

    if (latestDate > new Date(0)) {
      feed.options.updated = latestDate;
    }

    const atomXml = feed.atom1();
  
    const outputPath = path.join(process.cwd(), "public", "feed.xml");
    fs.writeFileSync(outputPath, atomXml, "utf8");
  
    console.log("Atom feed generated successfully at", outputPath);
  };
  
  generateFeed();