import QRCode from 'qrcode';

export class ARQRCodeGenerator {
  private qrCodeElement: HTMLElement | null = null;
  private qrCodeContainer: HTMLElement | null = null;

  constructor() {
    // Initialize QR code container when needed
    this.createQRCodeContainer();
  }

  private createQRCodeContainer() {
    // Create container for QR code if it doesn't exist
    if (!this.qrCodeContainer) {
      this.qrCodeContainer = document.createElement('div');
      this.qrCodeContainer.id = 'ar-qr-code-container';
      this.qrCodeContainer.style.display = 'none';
      this.qrCodeContainer.style.position = 'absolute';
      this.qrCodeContainer.style.top = '50%';
      this.qrCodeContainer.style.left = '50%';
      this.qrCodeContainer.style.transform = 'translate(-50%, -50%)';
      this.qrCodeContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      this.qrCodeContainer.style.padding = '20px';
      this.qrCodeContainer.style.borderRadius = '12px';
      this.qrCodeContainer.style.zIndex = '1000';
      this.qrCodeContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
      this.qrCodeContainer.style.border = '2px solid #00EC97';

      // Create QR code element
      this.qrCodeElement = document.createElement('div');
      this.qrCodeElement.id = 'ar-qr-code';
      this.qrCodeContainer.appendChild(this.qrCodeElement);

      // Add title
      const title = document.createElement('div');
      title.textContent = 'Scan with MetaMask';
      title.style.color = '#00EC97';
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '15px';
      title.style.textAlign = 'center';
      this.qrCodeContainer.insertBefore(title, this.qrCodeElement);

      // Add instructions
      const instructions = document.createElement('div');
      instructions.textContent = 'Scan this QR code with your MetaMask wallet to pay for agent interaction';
      instructions.style.color = '#ffffff';
      instructions.style.fontSize = '14px';
      instructions.style.marginTop = '15px';
      instructions.style.textAlign = 'center';
      instructions.style.maxWidth = '250px';
      this.qrCodeContainer.appendChild(instructions);

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.backgroundColor = '#333';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.padding = '8px 16px';
      closeButton.style.borderRadius = '4px';
      closeButton.style.marginTop = '15px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.width = '100%';
      closeButton.onclick = () => this.removeQRCode();
      this.qrCodeContainer.appendChild(closeButton);

      // Add to document body
      document.body.appendChild(this.qrCodeContainer);
    }
  }

  /**
   * Generate and display a QR code for blockchain payment
   * @param walletAddress Recipient wallet address
   * @param amount Amount to pay in USDFC
   * @param agentName Name of the agent for display purposes
   * @returns Promise that resolves when QR code is generated
   */
  public async generateQRCode(walletAddress: string, amount: number, agentName: string): Promise<void> {
    try {
      if (!this.qrCodeElement || !this.qrCodeContainer) {
        this.createQRCodeContainer();
      }

      if (!this.qrCodeElement) {
        console.error('QR code element not found');
        return;
      }

      // Convert amount to wei (18 decimals for USDFC)
      const amountInWei = amount * 10**18;
      
      // Create EIP-681 compliant URI for MetaMask
      // Using chainId 1043 for BlockDAG Primordial Testnet
      const eip681Uri = `ethereum:${walletAddress}@1043/transfer?value=${amountInWei.toString()}&gas=21000`;
      
      console.log('Generated EIP-681 URI:', eip681Uri);

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(eip681Uri, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 250,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create image element
      const img = document.createElement('img');
      img.src = qrCodeDataUrl;
      img.style.width = '250px';
      img.style.height = '250px';
      img.style.display = 'block';
      img.style.margin = '0 auto';

      // Clear previous QR code and add new one
      if (this.qrCodeElement) {
        this.qrCodeElement.innerHTML = '';
        this.qrCodeElement.appendChild(img);
      }

      // Update title with agent name and amount
      const title = this.qrCodeContainer?.querySelector('div');
      if (title) {
        title.textContent = `Pay ${amount} USDFC to ${agentName}`;
      }

      // Show QR code container
      if (this.qrCodeContainer) {
        this.qrCodeContainer.style.display = 'block';
      }

    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  /**
   * Remove the QR code from display
   */
  public removeQRCode(): void {
    if (this.qrCodeContainer) {
      this.qrCodeContainer.style.display = 'none';
    }
  }
}