import * as React from 'react';

interface ILayoutProps {}

const Layout: React.FunctionComponent<ILayoutProps> = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">Sidebar</aside>
      <div className="flex gap-x-4 bg-gray-100 fixed top-0 left-0 z-40 lg:w-60 h-screen" />
      <aside />
    </div>
  );
};

export default Layout;
