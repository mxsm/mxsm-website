import { useLocation } from '@docusaurus/router';
import { usePluginData } from '@docusaurus/useGlobalData';
import OriginalTOC from '@theme-original/TOC';
import EditThisPage from '@theme/EditThisPage';
import React, { useEffect, useState } from 'react';
import { PrismicRichText } from '@prismicio/react';

export default function TOC({ toc, editUrl, ...props }) {
  const { prismicAds } = usePluginData('ionic-docs-ads');
  const [activeAd, setActiveAd] = useState<typeof prismicAds.data>();
  const location = useLocation();

  const isEmpty = toc.length <= 0;

  useEffect(() => {
    setActiveAd(prismicAds[Math.floor(Math.random() * prismicAds.length)].data);
  }, [location]);

  if (isEmpty) return null;

  return (
    <div className="toc-wrapper">
      <h2>Contents</h2>
      <OriginalTOC toc={toc} {...props} />
      <EditThisPage editUrl={editUrl} />


    </div>
  );
}
