import Image from "next/image";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

export default function Home() {
  const blogDir = "blog";

  const files  = fs.readdirSync(path.join(blogDir));

  const blogs = files.map((file) => {
    const fileContent = fs.readFileSync(path.join(blogDir, file), "utf-8");
    const { data: frontMatter } = matter(fileContent);

    return {
      meta: frontMatter,
      date: frontMatter.date,
      slug: file.replace(".mdx", ""),
      category: frontMatter.category,
      uri: frontMatter.uri || file.replace(".mdx", "")
    }
  }).sort((a,b) => a.date > b.date ? -1 : 1);

return (
  <main className="flex flex-col">
    <h1 className="text-3xl font-bold">
      Piers Sinclair
    </h1>

    <section className='py-10'>

    <Image src="/images/2021-07-13-piers.jpg" alt="Piers Sinclair" width={1000} height={1000} />

      <div className='py-2'>
        {blogs.map(blog => (
          <Link href={`/blog/${blog.category}/${blog.uri}`} passHref key={blog.slug}>
            <div className='py-2 flex justify-between align-middle gap-2'>
                <div>
                    <h3 className="text-lg font-bold">{blog.meta.title}</h3>
                    <p className="text-gray-400">{blog.meta.description}</p>
                </div>
                <div className="my-auto text-gray-400">
                    <p>{blog.meta.date}</p>
                </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  </main>
)
}