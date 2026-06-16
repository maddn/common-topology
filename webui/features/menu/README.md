# Sidebar Menu Model

The sidebar is built around a context-to-service-view model.

The selected topology is the canvas context. In the topology project it is also
the sidebar context: service lists are filtered to the currently selected
topology. In tme-demo the canvas topology is fixed to `demo`; the intended
sidebar context is the selected tenant.

Service panes deliberately separate two paths:

- `keypath` is the data/config-editor path. Values shown in the pane are read
  from this path, and the Go To button opens this path in the Configuration
  Editor.
- `serviceKeypath` is the NSO service-operation path. Modified-device
  highlighting and redeploy/touch actions are relative to this service.

Those paths are different when a service is managed through a stacked service.
For example, topology IGP values may be read from a managed-topology child list,
and the Go To button should open that managed-topology child list. Redeploy and
modified-device highlighting should target the generated lower IGP service when
it exists.

The same concept applies to tme-demo. A tenant is a real NSO service stacked
over lower L3VPN and data-centre services. The user controls the tenant service,
but generated device configuration may have backpointers to the lower services.

`openService` is the selected service-view identity. `getOpenServiceReferences`
resolves the service references used for ConfigViewer backpointer highlighting:
normally `[openService]`, plus any explicit `configReferences` published by
stacked service views that need to match configuration created by their lower
services. These `configReferences` are additional lower-service backpointer
references. For example, the tme-demo tenant context publishes its lower L3VPN
and data-centre service references so selecting the tenant can highlight the
configuration created by those services.

Normal services do not need to store `configReferences`; the selector falls back
to the selected `openService` keypath.

The same selected service drives canvas highlighting. When a service pane is
open, it reads `${serviceKeypath}/modified/devices` and stores that list in the
topology slice as `highlightedIcons`. Icons whose device names appear in that
list are highlighted on the canvas. Changing `openService` clears the highlighted
icons before the newly selected pane publishes its modified-device list.

`ServicePane` normally owns its accordion state by comparing `openService` with
`serviceKeypath`. A context selector that is also an NSO service, such as the
tme-demo tenant, can pass `isOpen`, `fade`, and `toggled` to control the
accordion state itself while still reusing `ServicePane` features such as Go To,
delete, redeploy, config references, and modified-device highlighting.

## Service Module Pattern

`ServiceList` is the common context-filtered list renderer. It should not know
about managed-topology, tenants, L3VPN, or data-centre service details.

Each project-local service module owns the model-specific normalization needed
to make stacked/input services and direct/lower services look like the same
service view to the common UI.

A service module should provide:

- `label`, `service`, and optional `title`
- `path` for the direct/lower service list/query path
- `stackedPath` for the stacked/input service list/query path
- optional `newItemContextLeaf` when direct service creation should prefill the
  current context
- `useQuery(itemSelector, stacked)` for stacked/input data when `stacked` is
  true and direct/lower service data when it is false
- `useFetchStatus()` for the status labels shown by `NodeListWrapper`
- `getContextName` when context membership is not a plain `topology` leaf
- `getServiceName` when the service identity is not a plain `name` leaf
- a component that resolves the displayed data path, service-operation path,
  and config/backpointer references

The two `useQuery` forms should select the same logical fields wherever the
underlying YANG models support them. If the leaf paths differ, normalize that in
the service module, not in `ServiceList`. For example, a stacked service may
read `tenant/l3vpn/qos-policy` while the direct lower service reads
`qos/qos-policy`; both represent the same displayed QoS Policy field.

The service component should query both forms, display stacked/input data when
it exists, and prefer the direct/lower service keypath for service operations
when that lower service exists. If the lower service does not exist yet, use a
stacked fallback keypath ending in `/..` so the child service view stays
distinct while service operations resolve to the stacked parent.

## Path Examples

These examples omit namespace prefixes and use `lab1`, `core`, `65000`, and
`Cyberdyne` as sample keys.

| Pane | Scenario | `keypath` | `serviceKeypath` | modified-devices path |
| --- | --- | --- | --- | --- |
| Managed Topology | selected directly | `/topologies/managed-topology{lab1}` | same | `/topologies/managed-topology{lab1}/modified/devices` |
| IGP | standalone | `/topologies/igp{core}` | same | `/topologies/igp{core}/modified/devices` |
| IGP | managed, lower service exists | `/topologies/managed-topology{lab1}/igp{core}` | `/topologies/igp{core}` | `/topologies/igp{core}/modified/devices` |
| IGP | managed fallback | `/topologies/managed-topology{lab1}/igp{core}` | `/topologies/managed-topology{lab1}/igp{core}/..` | `/topologies/managed-topology{lab1}/modified/devices` |
| BGP | standalone | `/topologies/bgp{65000}` | same | `/topologies/bgp{65000}/modified/devices` |
| BGP | managed, lower service exists | `/topologies/managed-topology{lab1}/bgp{65000}` | `/topologies/bgp{65000}` | `/topologies/bgp{65000}/modified/devices` |
| BGP | managed fallback | `/topologies/managed-topology{lab1}/bgp{65000}` | `/topologies/managed-topology{lab1}/bgp{65000}/..` | `/topologies/managed-topology{lab1}/modified/devices` |
| Base Config | standalone | `/topologies/base-config{lab1}` | same | `/topologies/base-config{lab1}/modified/devices` |
| Base Config | managed, lower service exists | `/topologies/managed-topology{lab1}` | `/topologies/base-config{lab1}` | `/topologies/base-config{lab1}/modified/devices` |
| Base Config | managed fallback | `/topologies/managed-topology{lab1}` | `/topologies/managed-topology{lab1}/ntp-server/..` | `/topologies/managed-topology{lab1}/modified/devices` |
| IP Connectivity | standalone | `/topologies/topology{lab1}/ip-connectivity` | same | `/topologies/topology{lab1}/ip-connectivity/modified/devices` |
| IP Connectivity | managed, lower service exists | `/topologies/managed-topology{lab1}` | `/topologies/topology{lab1}/ip-connectivity` | `/topologies/topology{lab1}/ip-connectivity/modified/devices` |
| IP Connectivity | managed fallback | `/topologies/managed-topology{lab1}` | `/topologies/managed-topology{lab1}/ipv6/..` | `/topologies/managed-topology{lab1}/modified/devices` |
| Tenant | context/default service view | `/tme-demo/tenant{Cyberdyne}` | same | `/tme-demo/tenant{Cyberdyne}/modified/devices` |
| L3VPN | tenant stacked | `/tme-demo/tenant{Cyberdyne}/l3vpn` | `/l3vpn/vpn/l3vpn{Cyberdyne}` | `/l3vpn/vpn/l3vpn{Cyberdyne}/modified/devices` |
| Data Centre | tenant stacked | `/tme-demo/tenant{Cyberdyne}/data-centre` | `/datacenter/connectivity{Cyberdyne}` | `/datacenter/connectivity{Cyberdyne}/modified/devices` |

In this table, "managed fallback" means managed-topology data is available and
is being displayed, but the generated lower service keypath is not yet available
from the lower service query.

## Managed Fallback

The `/..` fallback is intentional. It preserves two pieces of information in one
path:

- it remains a unique service-view identity for the child pane
- it still resolves back to the managed-topology parent for service operations

Passing only the managed-topology parent would make the child pane
indistinguishable from the actual Managed Topology pane in `openService`.

This is especially important for `base-config` and `ip-connectivity`. Their
managed data can be displayed from the managed-topology parent itself, so the
fallback appends a representative child leaf such as `ntp-server` or `ipv6`
before `/..` to keep the child service view distinct.

The current code strips the final child segment plus `/..` when reading
`modified/devices`. Redeploy/touch currently uses the raw fallback path and
relies on NSO resolving the `..` segment.
