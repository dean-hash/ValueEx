"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Error({ statusCode }) {
    return (React.createElement("p", null, statusCode ? `An error ${statusCode} occurred on server` : 'An error occurred on client'));
}
Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};
exports.default = Error;
//# sourceMappingURL=_error.js.map