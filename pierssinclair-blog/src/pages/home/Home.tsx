import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPosts, PostModel } from "../../utils/postUtils";

const Home: React.FC = () => {
    const [posts, setPosts] = useState<PostModel[]>([]);

    useEffect(() => {
        const loadPosts = async () => { 
            const posts = await fetchPosts();
            setPosts(posts);
        };

        loadPosts();
    }, []);

  return (
    <div className="container mx-auto py-8 px-6">
      <h1 className="text-4xl font-bold mb-6">Blog Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug} className="mb-4">
            <Link to={`/post/${post.slug}`}>
              <h2 className="text-2xl font-semibold text-blue-600 hover:underline">
                {post.frontmatter.title}
              </h2>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
