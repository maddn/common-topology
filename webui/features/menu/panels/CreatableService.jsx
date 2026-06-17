import React from 'react';
import { Fragment, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import Accordion from 'features/common/Accordion';
import InlineBtn from 'features/common/buttons/InlineBtn';

import { configurationEditorUrl } from 'features/nso/WebuiOne';
import * as IconTypes from 'constants/Icons';

import { useCreateMutation } from 'api/data';
import { stopThenGoToUrl } from 'api/comet';

const noop = () => {};

function CreatableService({ label, keypath }) {
  console.debug('CreatableService Render');

  const dispatch = useDispatch();

  const [ create ] = useCreateMutation();
  const createNode = useCallback(() => {
    create({ keypath });
    dispatch(stopThenGoToUrl(configurationEditorUrl(keypath, true)));
  });

  return (
   <Accordion
     level="1"
     isOpen={false}
     toggle={noop}
     header={
      <Fragment>
        <span className="header__title-text">{label}</span>
        <InlineBtn
          icon={IconTypes.BTN_ADD}
          tooltip={`Create ${label}`}
          onClick={createNode}
        />
      </Fragment>
      }>
    </Accordion>
  );
}

export default CreatableService;
