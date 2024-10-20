import {RouteConfig} from '../definitions';
import {Location} from 'history';

export default function getArgs<T extends Record<string, any>>(
    config: RouteConfig<T>,
    data: {params: T; location: Location<any>}
): T {
    const {parse} = config;
    let args = {} as unknown as T;
    const searchParams = new URLSearchParams(data.location.search);

    let key: keyof T;
    for (key in parse) {
        const parser = parse[key];
        const {validate} = parser;

        let value;
        switch (parser.source) {
            case 'query':
                value = searchParams.get(key) || undefined;
                break;

            case 'param': {
                value = data.params[key];
                break;
            }

            case 'hash':
                value = data.location.hash.slice(1) || undefined;
                break;

            case 'state':
                value = data.location.state?.[key];
                break;
        }

        if (value === undefined) {
            args[key] = validate(value);
        } else {
            switch (parser.kind) {
                case 'boolean': {
                    args[key] = validate(JSON.parse(value));
                    break;
                }

                case 'number': {
                    args[key] = validate(Number(value));
                    break;
                }

                case 'JSON': {
                    if (parser.source === 'hash') {
                        args[key] = validate(decodeURIComponent(value));
                    }
                    if (parser.source === 'query') {
                        try {
                            const parsedValue = JSON.parse(value);
                            args[key] = validate(parsedValue);
                        } catch (e) {
                            if (!(e instanceof Error)) throw e; // type narrowing
                            if (e.name === 'SyntaxError') {
                                const decodedValue = decodeURIComponent(value);
                                const parsedValue = JSON.parse(decodedValue);
                                args[key] = validate(parsedValue);
                            }
                        }
                    }

                    break;
                }

                case 'string':
                case 'transparent': {
                    args[key] = validate(value);
                    break;
                }
            }
        }
    }

    return args;
}
