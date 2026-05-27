import { Router, Route, redirect } from "@solidjs/router"

import RootLayout from "./RootLayout/RootLayout";
import Dashboard from "./Dashboard/Dashboard";
import { MsalProvider } from "./Auth/MsalProvider";
import Explore from "./Explore/Explore";
import Extra from "./Extra/Extra";
import Management from "./Management/Management";

import { type Instance, endpointOf, getInstanceConfig, getInstanceState, getInstanceStatus, getInstances } from "../../lib/apis";
import { msalInstance } from "../../lib/auth";

const AppRouter = () => {

    return (
            <MsalProvider>
                <Router root={RootLayout} >
                    <Route path="/dashboard" component={Dashboard} preload={async () => {
                        const instances = await getInstances();

                        instances.forEach((instance: Instance) => getInstanceState(instance));
                    }} />
                    <Route path="/:game/:name" component={Management} preload={async (p) => {
                        const account = msalInstance.getActiveAccount();
                        const state = await getInstanceState({ game: p.params.game, name: p.params.name, user_id: account!.homeAccountId } as Instance);
                        if (state.status === "gone") {
                            return redirect("/dashboard?no-such-instance");
                        }
                        const endpoint = endpointOf(state);
                        if (endpoint) {
                            getInstanceConfig(endpoint);
                            getInstanceStatus(endpoint);
                        }
                    }}  />
                    <Route path="/explore" component={Explore} />
                    <Route path="/extra" component={Extra} />
                </Router>
            </MsalProvider>
    )
}

export default AppRouter;