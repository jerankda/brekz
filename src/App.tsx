import Sidebar from "./components/Sidebar/Sidebar";
import ChatView from "./components/Chat/ChatView";

function App() {
  return (
    <div className="flex h-full w-full bg-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatView />
      </main>
    </div>
  );
}

export default App;