import { Router, Route, redirect } from "@solidjs/router"
import { ErrorBoundary } from "solid-js";

import RootLayout from "./RootLayout/RootLayout";
import Dashboard from "./Dashboard/Dashboard";
import { AuthProvider } from "./Auth/AuthProvider";
import Explore from "./Explore/Explore";
import Extra from "./Extra/Extra";
import Management from "./Management/Management";
import RouteError from "./RouteError/RouteError";

import { type Instance, endpointOf, getInstanceConfig, getInstanceState, getInstanceStatus, getInstances } from "../../lib/apis";
import { getAccount } from "../../lib/auth";

/**
 * A preload is an optimisation: it warms the query cache so the route's own
 * components find the request already in flight. Nothing awaits the result, so
 * every promise started here has to own its failure — the router floats them,
 * and `getInstanceState` throws by design on 401, 403 and 5xx, which turned one
 * unhealthy instance into an unhandled rejection on every navigation.
 *
 * Swallowing is the right answer rather than reporting: the components re-read
 * the same queries and render their own error states, so a failure here has
 * already been handled by the time anyone can see it.
 *
 * The library does attach its own catch, but only to calls made synchronously
 * inside the preload — its `inPreloadFn` flag is cleared before the first
 * `await` resolves, so everything after one is on us.
 */
const warm = (p: Promise<unknown>) => void p.catch(() => {});

const AppRouter = () => {

    return (
            /* Last resort: a throw above the shell (a bad auth config, a router
               that won't build) has nothing else to catch it, and blanks the
               page. Routes are covered closer in, by RootLayout. */
            <ErrorBoundary fallback={(err) => {
                console.error("app shell failed to start", err);
                return <RouteError fullWidth onRetry={() => window.location.reload()} />;
            }}>
                <AuthProvider>
                    <Router root={RootLayout} >
                        <Route path="/dashboard" component={Dashboard} preload={() => {
                            warm(getInstances().then((instances: Instance[]) => {
                                instances.forEach((instance: Instance) => warm(getInstanceState(instance)));
                            }));
                        }} />
                        <Route path="/:game/:name" component={Management} preload={async (p) => {
                            try {
                                const account = await getAccount();
                                const state = await getInstanceState({ game: p.params.game, name: p.params.name, user_id: account?.sub ?? "" } as Instance);
                                if (state.status === "gone") {
                                    return redirect("/dashboard?no-such-instance");
                                }
                                const endpoint = endpointOf(state);
                                if (endpoint) {
                                    warm(getInstanceConfig(endpoint));
                                    warm(getInstanceStatus(endpoint));
                                }
                            } catch {
                                // Same bargain as `warm`, for the awaited half: the
                                // page re-reads these queries and shows its own
                                // failure state. Letting it through would reject the
                                // preload promise, which the router also floats.
                            }
                        }}  />
                        <Route path="/explore" component={Explore} />
                        <Route path="/extra" component={Extra} />
                    </Router>
                </AuthProvider>
            </ErrorBoundary>
    )
}

export default AppRouter;
