import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPosts, PostModel } from "../../utils/postUtils";
import { format } from 'date-fns';

const Home: React.FC = () => {
    const [posts, setPosts] = useState<PostModel[]>([]);

    useEffect(() => {
        const loadPosts = async () => {
            const posts = await fetchPosts();

            const sortedPosts = posts.sort((a, b) => {
                const dateA = new Date(a.frontmatter.date).getTime();
                const dateB = new Date(b.frontmatter.date).getTime();
                return dateB - dateA;
            });

            setPosts(sortedPosts);
        };

        loadPosts();
    }, []);

    if (!posts || posts.length === 0) return <div>Loading...</div>;

    return (
        <div className="container mx-auto py-12 px-6 text-center">
            <div className="mb-8">
                <img
                    src="/assets/images/2021-07-13-piers.jpg"
                    loading="lazy"
                    alt="Piers Sinclair"
                    className="rounded-lg w-full max-w-3xl h-auto mx-auto"
                />
            </div>
            <ul className="space-y-8">
                {posts.map((post) => (
                    <li key={post.slug} className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 text-left mx-auto max-w-3xl">
                        <p className="text-sm text-gray-400 mb-2">
                            {format(new Date(post.frontmatter.date), 'dd MMM, yyyy')}
                        </p>
                        <Link to={`/post/${post.slug}`} className="group">
                            <h2 className="text-xl font-semibold text-blue-500 group-hover:text-blue-300 transition duration-300">
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
