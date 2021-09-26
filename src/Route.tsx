import React from 'react';
import {Route as ReactRouterRoute, useLocation, useParams} from 'react-router-dom';
import generateUrlAndState from './url/generateUrlAndState';
import {RouteObject, BoringRouteConfig, LazyRouteConfig, StandardRouteConfig} from './definitions';
import getArgs from './url/getArgs';
import {History} from 'history';

function createRouteObject<T>(
    config: StandardRouteConfig<T> | LazyRouteConfig<T>,
    RouteComponent: React.ComponentType<any>
): RouteObject<T> {
    const go = generateUrlAndState<T>(config);
    return {
        route: (
            <ReactRouterRoute exact path={config.path} key={config.path}>
                <RouteComponent />
            </ReactRouterRoute>
        ),
        // @ts-ignore - this is a dummy type to pass around for context
        _type: null,
        _actionCreator: (history: History) => ({
            to: (args: T) => go(args)[0],
            href: (args: T) => go(args)[0],
            push: (args: T) => history.push(...go(args)),
            replace: (args: T) => history.replace(...go(args))
        })
    };
}

function createRouteComponent<T>(config: StandardRouteConfig<T> | LazyRouteConfig<T>) {
    return function RouteComponent() {
        const params = useParams<T>();
        const location = useLocation();
        const Component = config.component;
        return <Component args={getArgs<T>(config, {params, location})} />;
    };
}

/**
The Route function is a wrapper around a component that describes what parts of the url are required by this component.
- config.path: The url you want to map to
- config.parse: a parsing object that matches your `args`
*/
export function Route<T = Record<string, any>>(config: StandardRouteConfig<T>): RouteObject<T> {
    return createRouteObject(config, createRouteComponent<T>(config));
}

/**
LazyRoute is the same as Route but the component is from React.lazy. 
Because typescript sometimes struggles narrowing unions, it is easier to have an explicit export.
*/
export function LazyRoute<T = Record<string, any>>(config: LazyRouteConfig<T>): RouteObject<T> {
    return createRouteObject(config, createRouteComponent<T>(config));
}

/**
BoringRoute have no arguments so don't require any parsers. Their component can be either lazy or normal.
*/
export function BoringRoute(config: BoringRouteConfig): RouteObject<undefined> {
    const {path, component: Component} = config;

    return {
        route: (
            <ReactRouterRoute exact path={path} key={path}>
                <Component />
            </ReactRouterRoute>
        ),
        _type: undefined,
        _actionCreator: (history: History) => ({
            to: () => path,
            href: () => path,
            push: () => history.push(path),
            replace: () => history.replace(path)
        })
    };
}
