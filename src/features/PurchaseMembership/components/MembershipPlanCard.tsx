import React, { useContext } from 'react';
import styled from 'styled-components';

import { Typography } from '@components';
import { SPACING, COLORS, BREAK_POINTS } from '@theme';
import { AssetContext, getAssetByUUID } from '@services/Store';
import { Asset, TUuid } from '@types';

import { IMembershipConfig, IMembershipId } from '../config';

const PlanCard = styled.div<{ fullwith?: boolean }>`
  @media screen and (max-width: ${BREAK_POINTS.SCREEN_SM}) {
    width: ${(props) => (props.fullwith ? '100%' : '48%')};
    margin-top: ${SPACING.SM};
    flex-direction: ${(props) => (props.fullwith ? 'row' : 'column')};
    justify-content: ${(props) => (props.fullwith ? 'space-evenly' : 'flex-start')};
    height: ${(props) => (props.fullwith ? '150px' : '212px')};
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 18%;
  padding: ${SPACING.BASE};
  background-color: ${COLORS.WHITE};
  border-radius: 6px;
  box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.07);
`;

const Description = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  & > * {
    padding-top: ${SPACING.SM};
  }
`;

const STypography = styled(Typography)`
  color: ${COLORS.BLUE_BRIGHT};
  font-style: italic;
  text-align: center;
`;

export default ({ plan }: { plan: IMembershipConfig }) => {
  const { assets } = useContext(AssetContext);
  const planAsset = getAssetByUUID(assets)(plan.assetUUID as TUuid) || ({} as Asset);

  return (
    <PlanCard fullwith={plan.key === IMembershipId.lifetime ? true : false}>
      <img src={plan.icon} />
      <Description>
        <Typography bold={true}>{plan.title}</Typography>
        <Typography>{`${plan.price} ${planAsset.ticker}`}</Typography>
        <STypography>{plan.discountNotice}</STypography>
      </Description>
    </PlanCard>
  );
};
