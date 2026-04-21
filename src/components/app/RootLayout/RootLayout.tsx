// Root layout — children is injected by the router
import RootSidebarNav from "../RootSidebarNav/Nav";

const RootLayout = (props: { children?: any }) => (
    <>
        <RootSidebarNav />
        {props.children}
    </>
);

export default RootLayout;