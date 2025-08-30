type Option<T> = Some<T> | None;

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

type SearchParams<TKeys extends string = string> = Promise<
  Record<TKeys, string | string[] | undefined>
>;

type SiteConfig = {
  name: string;
  domain: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter?: string;
    github?: string;
    docs?: string;
    changelog?: string;
  };
  twitterHandle?: string;
  twitterId?: string;
};

type NotFoundResponse = { notFound: true };

type SimpleComponentProps = {
  children?: React.ReactNode;
  className?: string;
};

type ImageSize = {
  width: number;
  height: number;
};

type LinkDetails = {
  title: string;
  href: string;
  description?: React.ReactNode;
  icon?: string;
  subLinks?: SubLinkDetails[];
};

type SubLinkDetails = Omit<LinkDetails, "subLinks">;
