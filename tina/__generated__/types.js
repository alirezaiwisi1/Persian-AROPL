export function gql(strings, ...args) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (args[i] || "");
  });
  return str;
}
export const SettingsPartsFragmentDoc = gql`
    fragment SettingsParts on Settings {
  __typename
  siteName
  homeTitle
  tagline
  metaDescriptionFa
  heroKicker
  heroTitle
  heroTitleSuffix
  heroParagraph
  heroCtaLabel
  aboutKicker
  aboutTitle
  aboutParagraph
  booksKicker
  booksTitle
  booksParagraph
  videosKicker
  videosTitle
  videosParagraph
  liveKicker
  liveTitle
  liveParagraph
  channelsKicker
  channelsTitle
  channelsParagraph
  ctaTitle
  ctaParagraph
  tiktokApiBase
  tiktokRefreshMs
  footerNote
}
    `;
export const BooksPartsFragmentDoc = gql`
    fragment BooksParts on Books {
  __typename
  variant
  coverImage
  coverAlt
  coverRatio
  restRotateY
  restRotateX
  spineLabel
  titleFa
  descriptionFa
  pdfUrl
  audioUrl
  officialUrl
}
    `;
export const YoutubePartsFragmentDoc = gql`
    fragment YoutubeParts on Youtube {
  __typename
  kicker
  title
  channelUrl
  channelAriaLabel
  channelImage
  channelImageAlt
  channelCta
  videos {
    __typename
    url
    autoTitle
    thumb
    thumbAlt
    channelLabel
    title
    ctaLabel
  }
}
    `;
export const TiktokPartsFragmentDoc = gql`
    fragment TiktokParts on Tiktok {
  __typename
  username
  displayName
  profileUrl
  avatar
  ariaLabel
  official
  language
  order
  featured
}
    `;
export const StudyPartsFragmentDoc = gql`
    fragment StudyParts on Study {
  __typename
  pageTitle
  sections {
    __typename
    num
    title
    blocks {
      __typename
      ... on StudySectionsBlocksParagraph {
        text
      }
      ... on StudySectionsBlocksFinalNote {
        text
      }
      ... on StudySectionsBlocksSubheading {
        text
      }
      ... on StudySectionsBlocksQuote {
        text
        source
      }
    }
  }
}
    `;
export const SettingsDocument = gql`
    query settings($relativePath: String!) {
  settings(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...SettingsParts
  }
}
    ${SettingsPartsFragmentDoc}`;
export const SettingsConnectionDocument = gql`
    query settingsConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: SettingsFilter) {
  settingsConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...SettingsParts
      }
    }
  }
}
    ${SettingsPartsFragmentDoc}`;
export const BooksDocument = gql`
    query books($relativePath: String!) {
  books(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...BooksParts
  }
}
    ${BooksPartsFragmentDoc}`;
export const BooksConnectionDocument = gql`
    query booksConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: BooksFilter) {
  booksConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...BooksParts
      }
    }
  }
}
    ${BooksPartsFragmentDoc}`;
export const YoutubeDocument = gql`
    query youtube($relativePath: String!) {
  youtube(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...YoutubeParts
  }
}
    ${YoutubePartsFragmentDoc}`;
export const YoutubeConnectionDocument = gql`
    query youtubeConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: YoutubeFilter) {
  youtubeConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...YoutubeParts
      }
    }
  }
}
    ${YoutubePartsFragmentDoc}`;
export const TiktokDocument = gql`
    query tiktok($relativePath: String!) {
  tiktok(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...TiktokParts
  }
}
    ${TiktokPartsFragmentDoc}`;
export const TiktokConnectionDocument = gql`
    query tiktokConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: TiktokFilter) {
  tiktokConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...TiktokParts
      }
    }
  }
}
    ${TiktokPartsFragmentDoc}`;
export const StudyDocument = gql`
    query study($relativePath: String!) {
  study(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...StudyParts
  }
}
    ${StudyPartsFragmentDoc}`;
export const StudyConnectionDocument = gql`
    query studyConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: StudyFilter) {
  studyConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...StudyParts
      }
    }
  }
}
    ${StudyPartsFragmentDoc}`;
export function getSdk(requester) {
  return {
    settings(variables, options) {
      return requester(SettingsDocument, variables, options);
    },
    settingsConnection(variables, options) {
      return requester(SettingsConnectionDocument, variables, options);
    },
    books(variables, options) {
      return requester(BooksDocument, variables, options);
    },
    booksConnection(variables, options) {
      return requester(BooksConnectionDocument, variables, options);
    },
    youtube(variables, options) {
      return requester(YoutubeDocument, variables, options);
    },
    youtubeConnection(variables, options) {
      return requester(YoutubeConnectionDocument, variables, options);
    },
    tiktok(variables, options) {
      return requester(TiktokDocument, variables, options);
    },
    tiktokConnection(variables, options) {
      return requester(TiktokConnectionDocument, variables, options);
    },
    study(variables, options) {
      return requester(StudyDocument, variables, options);
    },
    studyConnection(variables, options) {
      return requester(StudyConnectionDocument, variables, options);
    }
  };
}
import { createClient } from "tinacms/dist/client";
const generateRequester = (client) => {
  const requester = async (doc, vars, options) => {
    let url = client.apiUrl;
    if (options?.branch) {
      const index = client.apiUrl.lastIndexOf("/");
      url = client.apiUrl.substring(0, index + 1) + options.branch;
    }
    const data = await client.request({
      query: doc,
      variables: vars,
      url
    }, options);
    return { data: data?.data, errors: data?.errors, query: doc, variables: vars || {} };
  };
  return requester;
};
export const ExperimentalGetTinaClient = () => getSdk(
  generateRequester(
    createClient({
      url: "http://localhost:4001/graphql",
      queries
    })
  )
);
export const queries = (client) => {
  const requester = generateRequester(client);
  return getSdk(requester);
};
