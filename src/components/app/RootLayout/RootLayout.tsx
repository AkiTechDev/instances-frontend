// Root layout — children is injected by the router
import { ErrorBoundary } from "solid-js";

import RootSidebarNav from "../RootSidebarNav/Nav";
import RouteError from "../RouteError/RouteError";

/* The boundary sits here rather than around the whole router so the sidebar
   survives a route that throws: the user can navigate out of a broken page
   instead of reloading a blank one. `reset` re-renders the subtree, which is
   enough for a transient failure — anything deterministic lands back here, and
   the link out is the way through. */
const RootLayout = (props: { children?: any }) => (
    <>
        <RootSidebarNav />
        <ErrorBoundary fallback={(err, reset) => {
            console.error("route failed to render", err);
            return <RouteError onRetry={reset} />;
        }}>
            {props.children}
        </ErrorBoundary>
    </>
);

export default RootLayout;
