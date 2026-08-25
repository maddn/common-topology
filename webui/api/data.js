import { jsonRpcApi } from './index';
import { updateQueryData } from './query';

export const dataApi = jsonRpcApi.injectEndpoints({
  endpoints: (build) => ({

    getValue: build.query({
      query: ({ keypath }) => ({
        method: 'get_value',
        params: {
          path: keypath
        }
      }),
      providesTags: (_, __, { tag }) => tag ? [ 'data', tag ] : [ 'data' ],
      transformResponse: (response) => response?.result?.value
    }),

    setValue: build.mutation({
      query: ({ keypath, actionPath, leaf, value }) => ({
        method: 'set_value',
        actionPath,
        params: {
          path: `${actionPath || keypath}/${leaf}`,
          value: value
        }
      }),
      invalidatesTags: [ 'changes' ],
      async onQueryStarted(
        { keypath, actionPath, leaf, value }, { dispatch, queryFulfilled }
      ) {
        if (!actionPath) {
          await queryFulfilled;
          dispatch(updateQueryData(keypath, leaf, value, undefined, dispatch));
        }
      }
    }),

    create: build.mutation({
      query: ({ name, keypath, ...rest }) => ({
        method: 'create',
        params: {
          path: name ? `${keypath}{${name}}` : keypath
        }
      }),
      invalidatesTags: [ 'changes' ],
      async onQueryStarted(
        { name, keypath, ...rest }, { dispatch, queryFulfilled }
      ){
        await queryFulfilled;
        dispatch(updateQueryData(`${keypath}{${name}}`, name, rest));
      }
    }),

    renameListEntry: build.mutation({
      query: ({ fromPath, toKeys }) => ({
        method: 'rename_list_entry',
        params: {
          from_path: fromPath,
          to_keys: toKeys.map(([, value ]) => value)
        }
      }),
      invalidatesTags: [ 'changes' ],
      async onQueryStarted(
        { fromPath, toKeys, queryKey }, { dispatch, queryFulfilled }
      ) {
        await queryFulfilled;
        const toPath = fromPath.replace(
          /\{[^}]+}$/,
          `{${toKeys.map(([, value ]) => value).join(' ')}}`
        );
        toKeys.forEach(([ leaf, value ]) => {
          dispatch(updateQueryData(fromPath, leaf, value, queryKey, dispatch));
        });
        dispatch(updateQueryData(
          fromPath, 'keypath', toPath, queryKey, dispatch));
      }
    }),

    deletePath: build.mutation({
      query: ({ keypath }) => ({
        method: 'delete',
        params: {
          path: keypath
        }
      }),
      invalidatesTags: [ 'changes' ],
      async onQueryStarted({ keypath, queryKey }, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(updateQueryData(keypath, undefined, undefined, queryKey));
      }
    }),

    action: build.mutation({
      query: ({ transType, path, params }) => ({
        method: 'run_action',
        params: { path, params }
      }),
      transformResponse: (response) => {
        if (Array.isArray(response?.result)) {
          return response?.result.reduce(
            (accumulator, { name, value }) => {
              accumulator[name] = value;
              return accumulator;
            }, {}
          );
        } else {
          return response?.result;
        }
      }
    }),

  })
});

export const {
  endpoints: { action, create, setValue },
  useGetValueQuery, useSetValueMutation,
  useCreateMutation, useRenameListEntryMutation, useDeletePathMutation,
  useActionMutation
} = dataApi;
