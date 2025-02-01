import { NextPageContext } from 'next';
declare function Error({ statusCode }: { statusCode: number }): import('react').JSX.Element;
declare namespace Error {
  var getInitialProps: ({ res, err }: NextPageContext) => {
    statusCode: number;
  };
}
export default Error;
