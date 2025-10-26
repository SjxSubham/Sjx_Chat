import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";
// make this project complete soon
const Home = () => {
  return (
    <div className="flex h-screen sm:h-screen md:h-screen lg:h-screen rounded-lg overflow-hidden shadow-2xl bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-5">
      <Sidebar />
      <MessageContainer />
    </div>
  );
};

export default Home;
