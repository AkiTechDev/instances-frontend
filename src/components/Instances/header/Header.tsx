import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { getActiveAccount } from "../../../lib/auth";

const Username = component$(() => {
    const username = useSignal<string | null>(null);

    useVisibleTask$(async () => {
        const account = getActiveAccount();
        username.value = account?.name ?? account?.username ?? "Anonymous";
    });

    return (
        <>
            { username.value }
        </>
    )
})

export default Username;