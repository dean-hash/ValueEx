"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
function Home() {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [results, setResults] = (0, react_1.useState)([]);
    const [subreddit, setSubreddit] = (0, react_1.useState)('');
    const [productName, setProductName] = (0, react_1.useState)('');
    const [productCategory, setProductCategory] = (0, react_1.useState)('');
    const analyzeDemandForProduct = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/analyze-product-demand', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: Date.now().toString(), // temporary ID for testing
                    productName,
                    productCategory,
                    subreddit: subreddit || 'all',
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to analyze product demand');
            }
            const result = await response.json();
            setResults((prev) => [result, ...prev]);
            // Clear inputs after successful analysis
            setProductName('');
            setProductCategory('');
        }
        catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error analyzing product demand');
        }
        finally {
            setLoading(false);
        }
    };
    return (React.createElement("div", { className: "min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12" },
        React.createElement("div", { className: "relative py-3 sm:max-w-xl sm:mx-auto" },
            React.createElement("div", { className: "relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20" },
                React.createElement("div", { className: "max-w-md mx-auto" },
                    React.createElement("div", { className: "divide-y divide-gray-200" },
                        React.createElement("div", { className: "py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7" },
                            React.createElement("h2", { className: "text-2xl font-bold mb-8" }, "ValueEx Product Demand Analyzer"),
                            React.createElement("div", { className: "mb-8" },
                                React.createElement("h3", { className: "text-xl font-semibold mb-4" }, "1. Enter Product Details"),
                                React.createElement("div", { className: "mb-4" },
                                    React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Product Name"),
                                    React.createElement("input", { type: "text", value: productName, onChange: (e) => setProductName(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "e.g., iPhone 15, Nike Air Max, etc." })),
                                React.createElement("div", { className: "mb-4" },
                                    React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Category"),
                                    React.createElement("input", { type: "text", value: productCategory, onChange: (e) => setProductCategory(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "e.g., Electronics, Shoes, etc." }))),
                            React.createElement("div", { className: "mb-8" },
                                React.createElement("h3", { className: "text-xl font-semibold mb-4" }, "2. Filter Demand Sources"),
                                React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Subreddit"),
                                React.createElement("input", { type: "text", value: subreddit, onChange: (e) => setSubreddit(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "e.g., 'all' or specific subreddit" })),
                            React.createElement("button", { onClick: analyzeDemandForProduct, disabled: loading || !productName.trim(), className: `w-full py-2 px-4 rounded ${loading || !productName.trim() ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold` }, loading ? 'Analyzing...' : 'Analyze Demand'),
                            React.createElement("div", { className: "mt-8" },
                                React.createElement("h3", { className: "text-xl font-semibold mb-4" }, "3. Demand Analysis Results"),
                                results.map((result, index) => (React.createElement("div", { key: index, className: "mb-6 p-4 border rounded-lg bg-gray-50" },
                                    React.createElement("div", { className: "text-sm text-gray-500 mb-2" }, new Date(result.timestamp).toLocaleString()),
                                    React.createElement("div", { className: "mb-2" },
                                        React.createElement("strong", null, "Product:"),
                                        " ",
                                        result.productName),
                                    React.createElement("div", { className: "mb-2" },
                                        React.createElement("strong", null, "Category:"),
                                        " ",
                                        result.productCategory),
                                    React.createElement("div", { className: "mb-2" },
                                        React.createElement("strong", null, "Demand Score:"),
                                        ' ',
                                        React.createElement("span", { className: `px-2 py-1 rounded ${result.demandScore > 0.7
                                                ? 'bg-green-100 text-green-800'
                                                : result.demandScore > 0.4
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'}` },
                                            (result.demandScore * 100).toFixed(1),
                                            "%")),
                                    result.signals?.map((signal, sigIndex) => (React.createElement("div", { key: sigIndex, className: "mt-4 p-3 bg-white rounded border" },
                                        React.createElement("div", null,
                                            React.createElement("strong", null, "Source:"),
                                            " ",
                                            signal.source),
                                        React.createElement("div", null,
                                            React.createElement("strong", null, "Relevance:"),
                                            " ",
                                            (signal.relevance * 100).toFixed(1),
                                            "%"),
                                        React.createElement("div", { className: "mt-2" },
                                            React.createElement("strong", null, "Key Points:"),
                                            React.createElement("ul", { className: "list-disc pl-5" }, signal.keyPoints?.map((point, i) => (React.createElement("li", { key: i }, point))))),
                                        signal.pricePoints && signal.pricePoints.length > 0 && (React.createElement("div", { className: "mt-2" },
                                            React.createElement("strong", null, "Price Points Mentioned:"),
                                            React.createElement("ul", { className: "list-disc pl-5" }, signal.pricePoints.map((price, i) => (React.createElement("li", { key: i },
                                                "$",
                                                price.value,
                                                " (",
                                                price.context,
                                                ")"))))))))))))))))))));
}
//# sourceMappingURL=index.js.map