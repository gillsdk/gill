import { ImageResponse } from "next/og";
import type { ReactElement, ReactNode } from "react";
import type { ImageResponseOptions } from "next/dist/compiled/@vercel/og/types";

interface GenerateProps {
  title: ReactNode;
  description?: ReactNode;
  primaryTextColor?: string;
}

export function generateOGImage(options: GenerateProps & ImageResponseOptions): ImageResponse {
  const { title, description, primaryTextColor, ...rest } = options;

  return new ImageResponse(
    generate({
      title,
      description,
      primaryTextColor,
    }),
    {
      width: 1200,
      height: 630,
      ...rest,
    },
  );
}

export function generate({
  primaryTextColor = "rgb(255,150,255)",
  ...props
}: GenerateProps): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        color: "white",
        backgroundColor: "#121212",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "4rem",
        }}
      >
        <p
          style={{
            fontWeight: 600,
            fontSize: "76px",
          }}
        >
          {props.title}
        </p>
        <p
          style={{
            fontSize: "48px",
            color: "rgba(240,240,240,0.7)",
          }}
        >
          {props.description}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "24px",
              marginTop: "auto",
              color: primaryTextColor,
            }}
          >
            <svg viewBox="0 0 50 50" width="75" height="75">
              <g transform="translate(0 0) scale(0.5)">
                <g fill="#FFFFFF">
                  <path d="M85.293 52.445c0-5.717 3.197-10.954 8.505-15.021a17.637 17.637 0 0 0-8.505-2.168c-6.982 0-13.009 4.025-15.811 9.843-4.624-6.324-14.526-11.306-23.713-13.423.932-3.056 2.678-5.605 4.905-7.228-1.664-1.206-3.594-1.896-5.652-1.896-4.505 0-8.395 3.306-10.219 8.092-13.164.929-27.985 10.334-27.985 21.801 0 3.731 1.571 7.245 4.143 10.319.038-.002.075-.007.113-.01 1.878 2.216 4.276 4.198 6.98 5.868-.029.027-.056.057-.085.084 5.626 3.49 12.586 5.616 18.937 5.616 4.243 0 9.259-.949 14.155-2.62 2.063 3.485 5.366 5.744 9.09 5.744 2.067 0 4.005-.696 5.672-1.912-2.465-1.786-4.342-4.708-5.185-8.195 3.647-2.156 6.773-4.718 8.844-7.548 2.802 5.818 8.828 9.843 15.811 9.843 3.087 0 5.987-.787 8.505-2.169-5.308-4.065-8.505-9.302-8.505-15.02zm-64.466-.127a3.516 3.516 0 1 1 0-7.032 3.516 3.516 0 0 1 0 7.032zm20.191.956a4.515 4.515 0 0 1-3.538 4.406 4.517 4.517 0 1 1-2.295 8.729 4.517 4.517 0 0 0 0-8.641c.107-.033.217-.062.328-.086a5.09 5.09 0 0 1-.328-.086 4.517 4.517 0 0 0 .404-8.495 5.073 5.073 0 0 1-.404-.101l.066-.023c-.023-.008-.044-.017-.066-.023.131-.04.266-.072.402-.1a4.518 4.518 0 0 0-.403-8.496 4.516 4.516 0 0 1 2.703 8.619 4.515 4.515 0 0 1 3.131 4.297z"></path>
                </g>
              </g>
            </svg>
            <p
              style={{
                fontSize: "46px",
                fontWeight: 600,
              }}
            >
              gill
            </p>
          </div>

          <p
            style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "rgba(240,240,240,0.7)",
            }}
          >
            https://gillsdk.com
          </p>
        </div>
      </div>
    </div>
  );
}
