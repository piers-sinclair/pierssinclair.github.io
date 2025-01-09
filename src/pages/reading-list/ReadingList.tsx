import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table";
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button";
import SortableHeaderButton from "@/components/ui/sortable-header-button";

export type Book = {
    order: number
    name: string
    author: string
    difficulty: string
}

export const columns: ColumnDef<Book>[] = [
    {
        accessorKey: "order",
        header: ({ column }) => <SortableHeaderButton column={column} title="Order" />,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeaderButton column={column} title="Name" />,
    },
    {
        accessorKey: "author",
        header: ({ column }) => <SortableHeaderButton column={column} title="Author" />,
    },
    {
        accessorKey: "difficulty",
        header: ({ column }) => <SortableHeaderButton column={column} title="Difficulty (1-5)" />,
    },
]

async function getData(): Promise<Book[]> {
    return [
        {
            order: 1,
            name: "Clean Code: A Handbook of Agile Software Craftsmanship",
            author: "Robert C. Martin",
            difficulty: "⭐",
        },
        {
            order: 2,
            name: "Adaptive Code: Agile coding with design patterns and SOLID principles",
            author: "Gary McLean Hall",
            difficulty: "⭐⭐",
        },
        {
            order: 3,
            name: "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
            author: "Robert C. Martin",
            difficulty: "⭐⭐⭐⭐",
        },
        {
            order: 4,
            name: "Domain-driven Design: Tackling Complexity in the Heart of Software",
            author: "Eric Evans",
            difficulty: "⭐⭐⭐⭐⭐",
        }
    ]
}

const ReadingList: React.FC = () => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const result = await getData();
            setData(result);
        };

        fetchData();
    }, []);

    return (
        <div className="container mx-auto py-12 max-w-screen-md">
            <h1 className="text-5xl font-bold mb-4 text-gray-100">Reading List</h1>
            <hr className="border-gray-700 mb-8" />
            These are the books I recommend for Software Engineers looking to improve their code.
            <br />
            <br />
            They are in the order I would read them.
            <br />
            <br />
            <div className="prose prose-lg prose-invert max-w-none text-sm">
                <div className="overflow-x-auto">

                    {data ? (
                        <DataTable columns={columns} data={data} />
                    ) : (
                        <p>Loading data...</p>
                    )}
                    <table className="min-w-full table-auto border-collapse">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left border-b w-80">Name</th>
                                <th className="px-4 py-2 text-left border-b">Author</th>
                                <th className="px-4 py-2 text-left border-b">Difficulty (1-5)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="px-4 py-2 border-b w-7/12">Clean Code: A Handbook of Agile Software Craftsmanship</td>
                                <td className="px-4 py-2 border-b">Robert C. Martin</td>
                                <td className="px-4 py-2 border-b">⭐</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border-b w-7/12">Adaptive Code via C#: Class and Interface Design, Design Patterns, and SOLID Principles: Agile coding with design patterns and SOLID principles</td>
                                <td className="px-4 py-2 border-b">Gary McLean Hall</td>
                                <td className="px-4 py-2 border-b">⭐⭐</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border-b w-7/12">Clean Architecture: A Craftsman's Guide to Software Structure and Design: A Craftsman's Guide to Software Structure and Design</td>
                                <td className="px-4 py-2 border-b">Robert C. Martin</td>
                                <td className="px-4 py-2 border-b">⭐⭐⭐⭐</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border-b w-7/12">Domain-driven Design: Tackling Complexity in the Heart of Software</td>
                                <td className="px-4 py-2 border-b">Eric Evans</td>
                                <td className="px-4 py-2 border-b">⭐⭐⭐⭐⭐</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default ReadingList;