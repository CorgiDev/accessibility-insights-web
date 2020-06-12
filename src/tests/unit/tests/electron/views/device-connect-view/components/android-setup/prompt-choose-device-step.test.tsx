// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AndroidSetupStepLayout } from 'electron/views/device-connect-view/components/android-setup/android-setup-step-layout';
import { CommonAndroidSetupStepProps } from 'electron/views/device-connect-view/components/android-setup/android-setup-types';
import { PromptChooseDeviceStep } from 'electron/views/device-connect-view/components/android-setup/prompt-choose-device-step';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { AndroidSetupStepPropsBuilder } from 'tests/unit/common/android-setup-step-props-builder';
import { IMock, Mock, Times } from 'typemoq';

describe('PromptChooseDeviceStep', () => {
    let props: CommonAndroidSetupStepProps;
    let closeAppMock: IMock<typeof props.deps.closeApp>;

    beforeEach(() => {
        closeAppMock = Mock.ofInstance(() => {});
        props = new AndroidSetupStepPropsBuilder('prompt-choose-device')
            .withDep('closeApp', closeAppMock.object)
            .build();
    });

    it('renders per snapshot', () => {
        const rendered = shallow(<PromptChooseDeviceStep {...props} />);
        expect(rendered.getElement()).toMatchSnapshot();
    });

    it('passes closeApp dep through', () => {
        const stubEvent = {} as React.MouseEvent<HTMLButtonElement>;
        const rendered = shallow(<PromptChooseDeviceStep {...props} />);
        rendered.find(AndroidSetupStepLayout).prop('leftFooterButtonProps').onClick(stubEvent);
        closeAppMock.verify(m => m(), Times.once());
    });

    it('next button becomes enabled after device is selected', () => {
        const rendered = mount(<PromptChooseDeviceStep {...props} />);
        expect(rendered.find('button').at(2).props().disabled).toBeTruthy();
        rendered.find('DeviceDescription').at(0).simulate('click');
        expect(rendered.find('button').at(2).props().disabled).toBeUndefined();
    });
});
