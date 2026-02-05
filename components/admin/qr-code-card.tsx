"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Download, ExternalLink } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useRef } from "react"
import { useTranslations } from "next-intl"

interface QrCodeCardProps {
    publicUrl: string
    restaurantName: string
    logoUrl?: string | null
    testLinkText: string
    title: string
}

export function QrCodeCard({ publicUrl, restaurantName, logoUrl, testLinkText, title }: QrCodeCardProps) {
    const t = useTranslations('Admin')
    const qrRef = useRef<HTMLDivElement>(null)

    const handleDownload = () => {
        if (!qrRef.current) return

        const svg = qrRef.current.querySelector("svg")
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(blob)

        const downloadLink = document.createElement("a")
        downloadLink.download = `${restaurantName.replace(/\s+/g, "_")}_QR.svg`
        downloadLink.href = url
        downloadLink.click()

        URL.revokeObjectURL(url)
    }

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div ref={qrRef} className="bg-white p-4 rounded-xl border shadow-sm">
                    <QRCodeSVG
                        value={publicUrl}
                        size={200}
                        level="H"
                        imageSettings={logoUrl ? {
                            src: logoUrl,
                            height: 50,
                            width: 50,
                            excavate: true,
                        } : undefined}
                    />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">{restaurantName}</p>
                    <p className="text-xs text-muted-foreground break-all max-w-[250px]">{publicUrl}</p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                    <Button variant="default" size="sm" onClick={handleDownload} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        {t('download_qr_png')}
                    </Button>
                    <Button variant="outline" size="sm" asChild className="w-full">
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                            {testLinkText}
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
