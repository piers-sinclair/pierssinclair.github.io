import React, { useEffect, useState } from "react";
import { format } from "date-fns";


const ReadingList: React.FC = () => {
    return (
        <div className="container mx-auto py-12 max-w-screen-md">
            <h1 className="text-5xl font-bold mb-4 text-gray-100">Reading List</h1>
            <hr className="border-gray-700 mb-8" />
            These are the books I recommend for Software Engineers looking to improve their code.
            <br/>
            <br/>
            They are in the order I would read them.

            <div className="prose prose-lg prose-invert max-w-none text-sm">
                <div className="overflow-x-auto">
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
                                <td className="px-4 py-2 border-b w-80">Clean Code: A Handbook of Agile Software Craftsmanship</td>
                                <td className="px-4 py-2 border-b">Robert C. Martin</td>
                                <td className="px-4 py-2 border-b">⭐</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border-b w-80">Clean Architecture: A Craftsman's Guide to Software Structure and Design: A Craftsman's Guide to Software Structure and Design</td>
                                <td className="px-4 py-2 border-b">Robert C. Martin</td>
                                <td className="px-4 py-2 border-b">⭐⭐⭐⭐</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border-b w-80">Domain-Driven Design</td>
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
