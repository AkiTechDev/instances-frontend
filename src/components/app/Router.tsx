import { Router, Route, redirect } from "@solidjs/router"

import RootLayout from "./RootLayout/RootLayout";
import Dashboard from "./Dashboard/Dashboard";
import { msalInstance, MsalProvider, useMsal } from "./Auth/MsalProvider";
import Explore from "./Explore/Explore";
import Extra from "./Extra/Extra";
import Management from "./Management/Management";

import { type Instance, getInstanceConfig, getInstanceEndpoint, getInstanceStatus, getInstances } from "../../lib/apis";

msalInstance.handleRedirectPromise().then((response) => {
    if (response?.account) {
        msalInstance.setActiveAccount(response.account)
    }
});

const AppRouter = () => {

    return (
            <MsalProvider>
                <Router root={RootLayout} >
                    <Route path="/dashboard" component={Dashboard} preload={async () => {
                        const instances = await getInstances();

                        instances.forEach((instance: Instance) => getInstanceEndpoint(instance));
                    }} />
                    <Route path="/:game/:name" component={Management} preload={async (p) => {
                        const { account} = useMsal();
                        const endpoint = getInstanceEndpoint({ game: p.params.game, name: p.params.name, user_id: account()!.homeAccountId} as Instance)
                        endpoint.then(endpoint => {
                            if (!endpoint) {
                                return redirect("/dashboard?no-such-instance");
                            }
                            getInstanceConfig(endpoint)
                            getInstanceStatus(endpoint)
                        })
                    }}  />
                    <Route path="/explore" component={Explore} />
                    <Route path="/extra" component={Extra} />
                </Router>
            </MsalProvider>
    )
}

export default AppRouter;