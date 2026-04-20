import { Router, Route } from "@solidjs/router"

import RootLayout from "./RootLayout/RootLayout";
import Dashboard from "./Dashboard/Dashboard";
import { msalInstance, MsalProvider, useMsal } from "./Auth/MsalProvider";
import { createSignal, Show, useContext } from "solid-js";
import Explore from "./Explore/Explore";
import Management from "./Management/Management";

import { type Instance, getInstanceConfig, getInstanceEndpoint, getInstanceStatus, getInstances } from "../../lib/apis";

const msalBootstrap = msalInstance.handleRedirectPromise().then((response) => {
    if (response?.account) {
        msalInstance.setActiveAccount(response.account)
    }
});


const AppRouter = () => {
    const [isReady, setIsReady] = createSignal(false);
    msalBootstrap.then(() => setIsReady(true));

    return (
        <Show when={isReady()}>
            <MsalProvider>
                <Router root={RootLayout}>
                    <Route path="/instances-frontend/dashboard" component={Dashboard} preload={() => {const {getToken} = useMsal(); getInstances(getToken)}}/>
                    <Route path="/instances-frontend/:game/:name" component={Management} preload={async (p) => {
                        const {getToken, account} = useMsal();
                        const endpoint = await getInstanceEndpoint(getToken, { game: p.params.game, name: p.params.name, user_id: account()?.nativeAccountId} as Instance)
                        getInstanceConfig(getToken, endpoint.endpoint)
                        getInstanceStatus(getToken, endpoint.endpoint)
                    }} />
                    <Route path="/instances-frontend/explore" component={Explore} />
                </Router>
            </MsalProvider>
        </Show>
    )
}

export default AppRouter;