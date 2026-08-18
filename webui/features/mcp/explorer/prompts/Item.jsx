import React, { memo } from 'react';

import Description from '../Description';
import InputList, { promptInputs } from '../InputList';
import ItemBase from '../ItemBase';


const PromptItem = memo(function PromptItem({
  title, prompt, isOpen, fade, toggle, onOutput, defaultArguments = {}
}) {
  console.debug('PromptItem Render');

  const name = prompt.name;
  const description = prompt.description;
  const promptArguments = prompt.arguments || [];
  const displayTitle = title || name;
  const request = {
    method: 'prompts/get',
    params: {
      name,
      arguments: defaultArguments
    }
  };

  const inputs = promptInputs(promptArguments, defaultArguments);

  return (
    <ItemBase
      title={displayTitle}
      request={request}
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      onOutput={onOutput}
    >
      <Description description={description} />
      <InputList inputs={inputs} />
    </ItemBase>
  );
});

export default PromptItem;
