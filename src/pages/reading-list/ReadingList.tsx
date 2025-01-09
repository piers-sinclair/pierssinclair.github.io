import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table/DataTable";
import SortableHeader from "@/components/ui/sortable-header/SortableHeader";

export type Book = {
    order: number
    name: string
    author: string
    difficulty: string
}

export const columns: ColumnDef<Book>[] = [
    {
        accessorKey: "order",
        header: ({ column }) => <SortableHeader column={column} title="#" />,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
    },
    {
        accessorKey: "author",
        header: ({ column }) => <SortableHeader column={column} title="Author" />,
    },
    {
        accessorKey: "difficulty",
        header: ({ column }) => <SortableHeader column={column} title="Difficulty (1-5)" />,
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
            These are the books I recommend for Backend Software Engineers looking to improve their code.
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
                </div>

            </div>
        </div>
    );
};

export default ReadingList;