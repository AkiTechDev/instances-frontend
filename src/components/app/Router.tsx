import { Router, Route } from "@solidjs/router"

import RootLayout from "./RootLayout/RootLayout";
import Dashboard from "./Dashboard/Dashboard";
import { msalInstance, MsalProvider, useMsal } from "./Auth/MsalProvider";
import { createSignal, Show, useContext } from "solid-js";
import Explore from "./Explore/Explore";
import Extra from "./Extra/Extra";
import Management from "./Management/Management";

import { type Instance, getInstanceConfig, getInstanceEndpoint, getInstanceStatus, getInstances } from "../../lib/apis";

const msalBootstrap = msalInstance.handleRedirectPromise().then((response) => {
    if (response?.account) {
        msalInstance.setActiveAccount(response.account)
    }
});


const AppRouter = () => {

    return (
            <MsalProvider>
                <Router root={RootLayout}>
                    <Route path="/instances-frontend/dashboard" component={Dashboard} preload={async () => {
                        const instances = await getInstances();

                        instances.forEach((instance: Instance) => getInstanceEndpoint(instance));
                    }} />
                    <Route path="/instances-frontend/:game/:name" component={Management} preload={async (p) => {
                        const { account} = useMsal();
                        const endpoint = getInstanceEndpoint({ game: p.params.game, name: p.params.name, user_id: account()!.homeAccountId} as Instance)
                        endpoint.then(endpoint => {
                            getInstanceConfig(endpoint)
                            getInstanceStatus(endpoint)
                        })
                    }} />
                    <Route path="/instances-frontend/explore" component={Explore} />
                    <Route path="/instances-frontend/extra" component={Extra} />
                </Router>
            </MsalProvider>
    )
}

export default AppRouter;