import Navigation from './Navigation';
import AdSense from './AdSense';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
        
        {/* AdSense Sidebar */}
        <aside className="w-80 bg-white shadow-lg p-4 m-4 rounded-lg">
          <div className="sticky top-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sponsored Content
            </h3>
            
            {/* AdSense Horizontal Ad */}
            <AdSense 
              className="mb-4"
              style={{ display: "block", minHeight: "250px" }}
            />
            
            {/* AdSense Sidebar Ad */}
            <AdSense 
              slot={import.meta.env.VITE_ADSENSE_HORIZONTAL_SLOT}
              className="mb-4"
              style={{ display: "block", minHeight: "600px" }}
            />
            
            {/* Tips Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Quick Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Provide detailed ticket descriptions</li>
                <li>• Check ticket status regularly</li>
                <li>• Use relevant skills for better matching</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
      
      {/* Footer AdSense */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <AdSense 
            slot={import.meta.env.VITE_ADSENSE_HORIZONTAL_SLOT}
            style={{ display: "block", minHeight: "90px" }}
            className="w-full"
          />
        </div>
      </footer>
    </div>
  );
};

export default Layout;
